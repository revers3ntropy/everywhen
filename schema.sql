SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --- Tables ---

CREATE TABLE `users` (
  `id` varchar(128) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `salt` varchar(255) NOT NULL,
  `created` int(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `entries` (
    `id` varchar(128) NOT NULL,
    `user` varchar(128) NOT NULL,
    `created` int(64) NOT NULL,
    `latitude` double DEFAULT NULL,
    `longitude` double DEFAULT NULL,
    `title` text NULL,
    `entry` text NOT NULL,
    `deleted` int(1) DEFAULT 0,
    `label` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

CREATE TABLE `events` (
    `id` varchar(128) NOT NULL,
    `user` varchar(128) NOT NULL,
    `name` varchar(256) NOT NULL,
    `start` int(64) NOT NULL,
    `end` int(64) NOT NULL,
    `label` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

CREATE TABLE `labels` (
    `id` varchar(128) NOT NULL,
    `user` varchar(128) NOT NULL,
    `name` varchar(256) NOT NULL,
    `colour` varchar(64) NOT NULL,
    `created` int(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

CREATE TABLE `ids` (
    `id` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --- Indexes ---
ALTER TABLE `users`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `username` (`username`);
COMMIT;
ALTER TABLE `entries` ADD PRIMARY KEY (`id`);
ALTER TABLE `events` ADD PRIMARY KEY (`id`);
ALTER TABLE `ids` ADD PRIMARY KEY (`id`);

ALTER TABLE `labels`
    ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;